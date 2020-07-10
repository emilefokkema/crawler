using System;
using Crawler.Robots;

namespace Crawler
{
    public class Domain
    {
        public string Host { get; }
        public IRobotsRule Robots { get; set; }
        public Uri Url { get; }

        public Domain(string host, Uri url)
        {
            Host = host;
            Url = url;
        }

        public bool AllowsVisitToUrl(Uri url)
        {
            return true;
        }

        public static string GetKeyForUrl(Uri url)
        {
            return url.Host;
        }

        public static Domain CreateForUrl(Uri url)
        {
            Uri domainUrl = new Uri($"{url.Scheme}://{url.Host}");
            return new Domain(url.Host, domainUrl);
        }
    }
}
