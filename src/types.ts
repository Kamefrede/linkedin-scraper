export interface JobListing {
  id: string;
  entityUrn: string;
  trackingUrn: string;
  title: string;
}

export interface FullJob extends JobListing {
  companyName: string;
  applyUrl: string;
  location: string;
  description: string;
  companyCategorySize: string;
}
