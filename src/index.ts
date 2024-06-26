import { curly } from "node-libcurl";
import cld from "cld";
import winston from "winston";
import { writeFile } from "fs/promises";
import {
  BATCH_SIZE,
  BLACKLISTED_CATEGORY_WORDS,
  BLACKLISTED_COMPANY_SIZE,
  BLACKLISTED_JOB_KEYWORDS,
  BLACKLISTED_JOB_NAME_KEYWORDS,
  JOB_QUERY,
  MAX_AMOUNT_JOBS,
  MAX_FAILURE_ATTEMPTS,
  OUTPUT_FILE,
  REQUEST_HEADERS,
  SLEEP_MAX_MS,
  SLEEP_MIN_MS,
} from "./config.js";
import { JobListing, FullJob } from "./types.js";
import {
  encodeURIComponentProperly,
  filterEmojis,
  includesArray,
  pipe,
  randomInRange,
  sleep,
} from "./util.js";
import { inspect } from "util";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "logs/error.json",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/debug.json",
      level: "debug",
    }),
    new winston.transports.Console({ level: "debug" }),
  ],
});

async function getJobListings(
  keyword: string,
  count: number,
  start: number
): Promise<JobListing[]> {
  const response = await curly.get(
    `https://www.linkedin.com/voyager/api/voyagerJobsDashJobCards?decorationId=com.linkedin.voyager.dash.deco.jobs.search.JobSearchCardsCollection-194&count=${count}&q=jobSearch&query=(origin:JOB_SEARCH_PAGE_OTHER_ENTRY,keywords:${encodeURIComponent(
      keyword
    )},locationUnion:(geoId:91000007),selectedFilters:(experience:List(2,3,4),workplaceType:List(2)))&start=${start}`,
    {
      httpHeader: REQUEST_HEADERS,
      followLocation: true,
    }
  );

  if (response.statusCode !== 200) {
    throw Error(
      `Response was not okay: ${
        response.statusCode
      } ${response.data.toString()}`
    );
  }

  const data = JSON.parse(response.data.toString());

  const filteredData = data.included
    .filter(
      ({
        entityUrn,
        title,
      }: {
        entityUrn: string;
        title: string | { text: string };
      }): boolean => {
        title = typeof title === "string" ? title : title?.text;

        if (!title) {
          return false;
        }

        const normalizedTitle = title.toLowerCase();

        return (
          entityUrn.match(/^urn:li:fsd_jobPosting:[0-9]+/) !== null &&
          !includesArray(BLACKLISTED_JOB_NAME_KEYWORDS, normalizedTitle)
        );
      }
    )
    .map(
      ({
        trackingUrn,
        title,
        entityUrn,
      }: {
        entityUrn: string;
        title: string;
        trackingUrn: string;
      }) => ({
        id: entityUrn.replace(/([A-z]|:)+/, ""),
        entityUrn,
        trackingUrn,
        title,
      })
    );

  return filteredData;
}

async function getListingDetails(jobs: JobListing[]) {
  const fullJobs: Partial<FullJob>[] = [...jobs];
  const jobUris = jobs.map((job) =>
    encodeURIComponentProperly(generateJobPostingCardUri(job.id))
  );
  const response = await curly.get(
    `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(jobCardPrefetchQuery:(jobUseCase:JOB_DETAILS,prefetchJobPostingCardUrns:List(${jobUris.join(
      ","
    )})))&queryId=voyagerJobsDashJobCards.ba855e2e19b5bb94b87bab1cb5632913`,
    {
      httpHeader: REQUEST_HEADERS,
      followLocation: true,
    }
  );

  if (response.statusCode !== 200) {
    throw Error(
      `Response was not okay: ${
        response.statusCode
      } ${response.data.toString()}`
    );
  }

  const data = JSON.parse(response.data.toString());
  const filteredData = data.included.filter(
    ({ entityUrn }: { entityUrn: string }): boolean => {
      return (
        entityUrn.match(
          /(^urn:li:fsd_jobDescription:[0-9]+)|(^urn:li:fsd_jobSeekerApplicationDetail:[0-9]+)|(^urn:li:fsd_company:[0-9]+)|(^urn:li:fsd_geo:[0-9]+)|(^urn:li:fsd_jobPosting:[0-9]+)|(^urn:li:fsd_jobPostingCard:\([0-9]+,JOB_DETAILS\))/
        ) !== null
      );
    }
  );

  filteredData.forEach(
    ({
      entityUrn,
      trackingUrn,
      "*location": location,
      ...rest
    }: {
      entityUrn: string;
      trackingUrn: string | undefined;
      name: string | undefined;
      companyApplyUrl: string | undefined;
      "*location": string | undefined;
      defaultLocalizedName: string | undefined;
      descriptionText: { text: string | undefined };
      companyDetails: {
        jobCompany: {
          "*company": string | undefined;
        };
      };
      jobInsightsV2ResolutionResults: {
        insightViewModel: {
          text: {
            text: string | undefined;
          };
        };
      }[];
    }) => {
      let id = entityUrn.replace(/([A-z]|:)+/, "");
      let jobDetails: Partial<FullJob> = {};

      if (
        entityUrn.match(/(^urn:li:fsd_jobPostingCard:\([0-9]+,JOB_DETAILS\))/)
      ) {
        id = id.replaceAll(/\(|\)|\,/g, "").replace(/[A-z]+/, "");
        jobDetails.companyCategorySize =
          rest?.jobInsightsV2ResolutionResults?.find(
            (insight: any) => !!insight.insightViewModel
          )?.insightViewModel?.text?.text || "";
      }

      if (
        entityUrn.match(
          /(^urn:li:fsd_company:[0-9]+)|(^urn:li:fsd_geo:[0-9]+)/
        ) !== null
      ) {
        return;
      }

      if (
        entityUrn.match(/^urn:li:fsd_jobSeekerApplicationDetail:[0-9]+/) !==
        null
      ) {
        jobDetails.applyUrl = rest.companyApplyUrl;
      }

      if (entityUrn.match(/^urn:li:fsd_jobPosting:[0-9]+/) !== null) {
        const geo = filteredData.find(
          ({ entityUrn }: { entityUrn: string }) => entityUrn === location
        );
        const company = filteredData.find(
          ({ entityUrn }: { entityUrn: string }) =>
            entityUrn === rest.companyDetails.jobCompany["*company"]
        );

        if (!geo) {
          logger.debug(
            "Failed to find location for listing:",
            id,
            location,
            entityUrn,
            trackingUrn,
            rest
          );
        }

        if (!company) {
          logger.debug(
            "Failed to find location for listing:",
            id,
            entityUrn,
            trackingUrn,
            rest
          );
        }

        if (geo) {
          jobDetails.location = geo.defaultLocalizedName;
        }

        if (company) {
          jobDetails.companyName = company.name;
        }
      }

      if (entityUrn.match(/(^urn:li:fsd_jobDescription:[0-9]+)/) !== null) {
        jobDetails.description = rest.descriptionText?.text || "";
      }

      const jobIndex = jobs.findIndex(({ id: otherId }) => id === otherId);

      if (jobIndex === -1) {
        logger.debug("Failed to match a job", id, entityUrn, trackingUrn, rest);
      }

      fullJobs[jobIndex] = {
        ...fullJobs[jobIndex],
        ...jobDetails,
      };
    }
  );

  return fullJobs;
}

function generateJobPostingCardUri(id: string): string {
  return `urn:li:fsd_jobPostingCard:(${id},JOB_DETAILS)`;
}

function filterUnwantedJobs(jobs: Partial<FullJob>[]) {
  return jobs?.filter(({ description, companyName }) => {
    const normalizedDescription = filterEmojis(description)?.toLowerCase();
    const normalizedCompanyName =
      filterEmojis(companyName)?.toLocaleLowerCase();
    return (
      !includesArray(BLACKLISTED_JOB_KEYWORDS, normalizedDescription) &&
      !includesArray(BLACKLISTED_JOB_KEYWORDS, normalizedCompanyName)
    );
  });
}

function filterOutCompanySize(jobs: Partial<FullJob>[]) {
  return jobs?.filter(({ companyCategorySize }) => {
    const normalizedCategorySize =
      filterEmojis(companyCategorySize)?.toLowerCase();
    return !includesArray(BLACKLISTED_COMPANY_SIZE, normalizedCategorySize);
  });
}

function filterOutCategories(jobs: Partial<FullJob>[]) {
  return jobs?.filter(({ companyCategorySize }) => {
    const normalizedCategorySize =
      filterEmojis(companyCategorySize)?.toLowerCase();
    return !includesArray(BLACKLISTED_CATEGORY_WORDS, normalizedCategorySize);
  });
}

async function filterNonEnglishJobs(jobs: Partial<FullJob>[]) {
  const englishJobs: Partial<FullJob>[] = [];
  for (const job of jobs) {
    const normalizedDescription = filterEmojis(
      job.description
    )?.toLocaleLowerCase();

    if (!normalizedDescription) {
      continue;
    }

    const languages = await cld.detect(normalizedDescription);

    if (languages.languages[0]?.code !== "en") {
      continue;
    }

    englishJobs.push(job);
  }
  return englishJobs;
}

async function runLoop() {
  let goodJobs: Partial<FullJob>[] = [];
  let jobsProcessed = 0;
  let amountFailed = 0;
  const pipeline = pipe(
    getListingDetails,
    filterOutCategories,
    filterOutCompanySize,
    filterUnwantedJobs,
    filterNonEnglishJobs,
    (jobs: Partial<FullJob>[]) =>
      jobs.map((job) => ({
        applyUrl: job.applyUrl,
        jobPostUrl: `https://www.linkedin.com/jobs/search/?currentJobId=${job.id}`,
        jobName: job.title,
        companyName: job.companyName,
        description: job.description,
        size: job.companyCategorySize,
      }))
  );

  while (jobsProcessed < MAX_AMOUNT_JOBS) {
    let listings: JobListing[] = [];

    try {
      listings = await getJobListings(
        JOB_QUERY,
        BATCH_SIZE,
        jobsProcessed
      );
    } catch (e) {
      amountFailed++;

      await sleep(
        randomInRange(
          SLEEP_MIN_MS * (amountFailed + 1),
          SLEEP_MAX_MS * (amountFailed + 1)
        )
      );

      if (amountFailed < MAX_FAILURE_ATTEMPTS) {
        logger.debug("Retrying job listing fetching", e);
        continue;
      }

      logger.error(
        `Failed to fetch jobs after ${amountFailed} attempts. Writing ${jobsProcessed} jobs to disk.`,
        e
      );

      break;
    }

    amountFailed = 0;
    const jobs: Partial<FullJob>[] = await pipeline(listings);
    goodJobs = goodJobs.concat(jobs);
    jobsProcessed += BATCH_SIZE;
    logger.info(`Processed ${jobsProcessed} jobs`);
    await sleep(
      randomInRange(
        SLEEP_MIN_MS * (amountFailed + 1),
        SLEEP_MAX_MS * (amountFailed + 1)
      )
    );
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(goodJobs, null, 4));
}

await runLoop();
