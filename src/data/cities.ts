export interface City {
  name: string;
  country: string;
  timezone: string;
}

export const cities: City[] = [
  { name: "Los Angeles", country: "US", timezone: "America/Los_Angeles" },
  { name: "New York", country: "US", timezone: "America/New_York" },
  { name: "Chicago", country: "US", timezone: "America/Chicago" },
  { name: "Denver", country: "US", timezone: "America/Denver" },
  { name: "Anchorage", country: "US", timezone: "America/Anchorage" },
  { name: "Honolulu", country: "US", timezone: "US/Hawaii" },
  { name: "Toronto", country: "CA", timezone: "America/Toronto" },
  { name: "Vancouver", country: "CA", timezone: "America/Vancouver" },
  { name: "São Paulo", country: "BR", timezone: "America/Sao_Paulo" },
  { name: "Buenos Aires", country: "AR", timezone: "America/Argentina/Buenos_Aires" },
  { name: "London", country: "UK", timezone: "Europe/London" },
  { name: "Paris", country: "FR", timezone: "Europe/Paris" },
  { name: "Berlin", country: "DE", timezone: "Europe/Berlin" },
  { name: "Amsterdam", country: "NL", timezone: "Europe/Amsterdam" },
  { name: "Moscow", country: "RU", timezone: "Europe/Moscow" },
  { name: "Istanbul", country: "TR", timezone: "Europe/Istanbul" },
  { name: "Dubai", country: "AE", timezone: "Asia/Dubai" },
  { name: "Mumbai", country: "IN", timezone: "Asia/Kolkata" },
  { name: "Kolkata", country: "IN", timezone: "Asia/Kolkata" },
  { name: "Delhi", country: "IN", timezone: "Asia/Kolkata" },
  { name: "Dhaka", country: "BD", timezone: "Asia/Dhaka" },
  { name: "Bangkok", country: "TH", timezone: "Asia/Bangkok" },
  { name: "Singapore", country: "SG", timezone: "Asia/Singapore" },
  { name: "Hong Kong", country: "HK", timezone: "Asia/Hong_Kong" },
  { name: "Shanghai", country: "CN", timezone: "Asia/Shanghai" },
  { name: "Beijing", country: "CN", timezone: "Asia/Shanghai" },
  { name: "Seoul", country: "KR", timezone: "Asia/Seoul" },
  { name: "Tokyo", country: "JP", timezone: "Asia/Tokyo" },
  { name: "Sydney", country: "AU", timezone: "Australia/Sydney" },
  { name: "Melbourne", country: "AU", timezone: "Australia/Melbourne" },
  { name: "Auckland", country: "NZ", timezone: "Pacific/Auckland" },
  { name: "Cairo", country: "EG", timezone: "Africa/Cairo" },
  { name: "Lagos", country: "NG", timezone: "Africa/Lagos" },
  { name: "Nairobi", country: "KE", timezone: "Africa/Nairobi" },
  { name: "Johannesburg", country: "ZA", timezone: "Africa/Johannesburg" },
];
