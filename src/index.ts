import { curly } from "node-libcurl";
import cld from "cld";
import winston from "winston";
import { inspect } from "util";

const headers = [
  "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Accept: application/vnd.linkedin.normalized+json+2.1",
  "Accept-Language: en-US,en;q=0.5",
  "x-li-lang: en_US",
  'x-li-track: {"clientVersion":"1.13.11889","mpVersion":"1.13.11889","osName":"web","timezoneOffset":0,"timezone":"Europe/Lisbon","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2.5,"displayWidth":3840,"displayHeight":2160}',
  "x-li-page-instance: urn:li:page:d_flagship3_search_srp_jobs;9ptFJdt9QZGH24cmuNHSDA==",
  "csrf-token: ajax:7619924964866155159",
  "x-restli-protocol-version: 2.0.0",
  "x-li-pem-metadata: Voyager - Careers=jobs-search-results",
  "x-li-deco-include-micro-schema: true",
  "DNT: 1",
  "Connection: keep-alive",
  "Referer: https://www.linkedin.com/jobs/search/?currentJobId=3843682363&f_E=2%2C3%2C4&f_WT=2&geoId=91000007&keywords=software%20engineer",
  'Cookie: bcookie="v=2&d2fbaf0e-abea-4278-8ee9-32ee4a85d487"; JSESSIONID="ajax:7619924964866155159"; bscookie="v=1&20220911161337ef13bfe2-173f-4ca3-8e06-10ff986f97ffAQF1TVR0MmAmwCgQKq1XM_NzF7WfTTSO"; li_at=AQEDASyTZ3QBpYoxAAABiVPPT1YAAAGON_ldlU0AcQLwPDmcR8v5p9aWYts_wGt58G4L6lNR0tipKIr331v2YaJY9Ar999x6qkCLh-ZguG_HkvfRzhJeFuwuEZ0Vc9zb58EJkP8Pb1lbCOkjnO4c4faX; liap=true; li_mc=MTsyMTsxNzA5ODIwODY5OzI7MDIxwuoj33rf1vzskWnFOl3Ul3vGQ8eqSTtciSfknMgLg6w=; timezone=Europe/Lisbon; li_theme=light; li_theme_set=app; li_alerts=e30=; G_ENABLED_IDPS=google; __ssid=a9ab21c8-88aa-4eb4-aeb7-ff9853fed3b7; dfpfpt=f70c21feed3d4a8fae2f571da6daf5bf; UserMatchHistory=AQLLR8biKfGVNgAAAY4ZQ-k5tcWFE455lWeGEYeh308SP1CHY6kTjn7XDP_YvMlHjqV74rGogpBKUi5qVOjAKCaHDAOBoenM-8I_-VYEE_hQLuAziOUyz2-V-UwQ3_3o9RsJSotVxVQ_U4oE1qyk7HGn4hTKrN1_Q9_IZ6amNKt0KxeQ7yDXQkfmM_Aitzgv92gPtxil3iWPM4WysOoxHnuVdm_vg-bkLqyfkbttl8z-F4Ut_sTDmFndozc5iKLskHwlQN3xncJs1YI0wQ-VtyIUUQrMeB8XKfkuCxCNfA; lang=v=2&lang=en-US; lidc="b=VB80:s=V:r=V:a=V:p=V:g=4019:u=311:x=1:i=1709820661:t=1709907061:v=2:sig=AQH7gXE57mpFVHOsP8o54O8lq2zbcKEz"; fptctx2=taBcrIH61PuCVH7eNCyH0FFaWZWIHTJWSYlBtG47cVsSoV0on80KpXqr8WezEywB32cy%252ffFE8IPGhxoHO6idTiTm9CV5KW%252fhjWll1QxorolZ2XdmpEzVXk%252fCLeQtdu4EXe2K6tL75noFaDyfBT7nSAyuvG8bL%252fw4UlMmtZ1CG50UeTQtichDvgsX6%252fMS31yo3mO0pRUlg5iCgar7Yhge1gbEZWfv9zxgE5jPGe8LRjIdAy%252bsjMukHm8X6GZZfcbOk5iuqJBp7BtzoOxvCmIHcBmKVVDJ39tyuLhhjFGxdHTw%252f47RMxbQSUMQjl9CS9%252bClhm0HLaxMnrdqTp%252bOqLq%252f4YoqsctZr92%252bGdHqjw%252fOGc%253d; sdsc=22%3A1%2C1709820857490%7EJAPP%2C0yopcx%2BRq%2F%2BEKBeXTIjz%2FmIkplXs%3D; SID=d602de0c-6eaf-4a82-bbd7-80d988729563; VID=V_2024_03_07_13_1030911; PLAY_LANG=en',
  "Sec-Fetch-Dest: empty",
  "Sec-Fetch-Mode: cors",
  "Sec-Fetch-Site: same-origin",
  "TE: trailers",
];

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "logs/error.json",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/approved.json",
      level: "info",
    }),
    new winston.transports.File({
      filename: "logs/debug.json",
      level: "debug",
    }),
    new winston.transports.Console({ level: "debug" }),
  ],
});
const blacklistedKeywords = [
  "front end",
  "frontend",
  "front-end",
  "ai",
  "web",
  "php",
  "ruby",
  "rails",
  "python",
  "data",
  "qa",
  "machine learning",
  "salesforce",
  "devops",
  'security',
  'infrastructure'
];

interface JobListing {
  id: string;
  entityUrn: string;
  trackingUrn: string;
  title: string;
}

interface FullJob extends JobListing {
  companyName: string;
  applyUrl: string;
  location: string;
  description: string;
  companyCategorySize: string;
}

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
      httpHeader: headers,
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
          !includesArray(blacklistedKeywords, normalizedTitle)
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
      httpHeader: headers,
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
                text: string | undefined
            }
        }
      }[]
    }) => {
      let id = entityUrn.replace(/([A-z]|:)+/, "");
      let jobDetails: Partial<FullJob> = {};

      if(entityUrn.match(/(^urn:li:fsd_jobPostingCard:\([0-9]+,JOB_DETAILS\))/)) {
        id = id.replaceAll(/\(|\)|\,/g, '').replace(/[A-z]+/, '');
        jobDetails.companyCategorySize= rest?.jobInsightsV2ResolutionResults?.find((insight: any) => !!insight.insightViewModel)?.insightViewModel?.text?.text || "";
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

function encodeURIComponentProperly(uri: string): string {
  return encodeURIComponent(uri).replace("(", "%28").replace(")", "%29");
}

function generateJobPostingCardUri(id: string): string {
  return `urn:li:fsd_jobPostingCard:(${id},JOB_DETAILS)`;
}

/*async function makeRequest(fullJobs: Partial<FullJob>[]) {
  for (const job of fullJobs) {
    try {
      const prompt = `
      Analyze the following job opportunity to determine if it aligns with specific career preferences. The job title is "[${job.title}]", offered by "[${job.companyName}]". The job description is as follows: "${job.description}".

      Criteria for evaluation:
      - Exclude any job related to blockchain, web3, or crypto.
      - Exclude roles in consulting or positions where the company or an individual is recruiting on behalf of their clients.

      After reviewing the job details, double-check the information to ensure accuracy and avoid any potential errors or misunderstandings. Based on the analysis, determine whether this job opportunity is suitable.

      Provide the decision in the following JSON format:
      {"shouldApply": boolean, "reasoning": string}

      Where 'shouldApply' is true if the job meets the criteria and false if it does not, and 'reasoning' explains the basis for the decision.`;
      logger.debug(JSON.stringify(job));
      const response = await curly.post(
        "http://192.168.1.129:11434/api/generate",
        {
          postFields: JSON.stringify({
            model: "nous-hermes2-mixtral",
            prompt,
            stream: false,
          }),
          httpHeader: ["Content-Type: application/json"],
        }
      );
      logger.debug(`Response: ${response.data.response}`)

      const llmJsonResponse: {
        shouldApply: boolean;
        reasoning: string;
      } = JSON.parse(response.data.response);

      const logMessage = {
        reasoning: llmJsonResponse.reasoning,
        applyUrl: job.applyUrl,
        jobPostUrl: `https://www.linkedin.com/jobs/search/?currentJobId=${job.id}`,
        jobName: job.title,
        companyName: job.companyName,
      };

      if (llmJsonResponse.shouldApply) {
        approvedLogger.info(logMessage);
      } else {
        rejectionLogger.info(logMessage);
      }
    } catch (error) {
      logger.error("Error:", error);
    }
  }
}*/

const blacklistedJobKeywords = [
  "cryptocurrency",
  "blockchain",
  "bitcoin",
  "web3",
  "consulting",
  "outsourcing",
  "staffing",
  "resourcing",
  "consultancy",
  "consultant",
  "php",
  "rails",
  "on-call",
  "odoo",
  'salesforce'
];

function filterOutCryptoJobs(jobs: Partial<FullJob>[]) {
  return jobs?.filter(({ description, companyName }) => {
    const normalizedDescription = filterEmojis(description)?.toLowerCase();
    const normalizedCompanyName =
      filterEmojis(companyName)?.toLocaleLowerCase();
    return (
      !includesArray(blacklistedJobKeywords, normalizedDescription) &&
      !includesArray(blacklistedJobKeywords, normalizedCompanyName)
    );
  });
}

const blacklistCategoryKeywords = [
    'staffing',
    'recruiting',
    'consulting',
    'human resources'
]

function filterOutCategories(jobs: Partial<FullJob>[]) {
    return jobs?.filter(({ companyCategorySize }) => {
      const normalizedCategorySize = filterEmojis(companyCategorySize)?.toLowerCase();
      return (
        !includesArray(blacklistCategoryKeywords, normalizedCategorySize)
      );
    });
  }

function includesArray(
  needles: string[],
  haystack: string | undefined
): boolean {
  if (!haystack) {
    return false;
  }
  return needles.some((needle) => haystack.includes(needle));
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

function filterEmojis(text: string | undefined) {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

  return text?.replace(emojiRegex, "");
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomInRange(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runLoop() {
  const batchSize = 25;
  let start = 0;
  while (start < 500) {
    const listings = await getJobListings(
      "software engineer",
      batchSize,
      start
    );
    const fullJobs = await getListingDetails(listings);
    const categoryJobs = filterOutCategories(fullJobs);
    const decentJobs = filterOutCryptoJobs(categoryJobs);
    const englishJobs = await filterNonEnglishJobs(decentJobs);

    for (const job of englishJobs) {
      logger.info({
        applyUrl: job.applyUrl,
        jobPostUrl: `https://www.linkedin.com/jobs/search/?currentJobId=${job.id}`,
        jobName: job.title,
        companyName: job.companyName,
        description: job.description,
        size: job.companyCategorySize
      });
    }
    start += batchSize;
    logger.info(`Processed ${start} jobs`);
    await sleep(randomInRange(1000, 2500));
  }
}

await runLoop();
