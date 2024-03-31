export const MAX_FAILURE_ATTEMPTS = 5;
export const SLEEP_MIN_MS = 1500;
export const SLEEP_MAX_MS = 5000;
export const BATCH_SIZE = 100;
export const MAX_AMOUNT_JOBS = 5000;
export const OUTPUT_FILE = "output.json";

export const BLACKLISTED_COMPANY_SIZE = ["5,000", "1,000", "10,000", "10,001"];

export const BLACKLISTED_JOB_KEYWORDS = [
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
  "salesforce",
  ".net",
  "internship",
  "laravel",
  /\bai/g,
  /\bscala/g,
];

export const BLACKLISTED_JOB_NAME_KEYWORDS = [
  "front end",
  "frontend",
  "freelance",
  "free lance",
  "front-end",
  /\bai/g,
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
  "security",
  "infrastructure",
  "internship",
];

export const BLACKLISTED_CATEGORY_WORDS = [
  "staffing",
  "recruiting",
  "consulting",
  "human resources",
  "hospitality",
  "advertising",
];

export const REQUEST_HEADERS = [
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
