using System;
using System.Threading.Tasks;
using Crawler.Robots;

namespace Crawler
{
    public class Domain
    {
        public Task WhenRobotsRuleHasBeenSet { get; set; }
        public bool RobotsRuleIsBeingSet { get; set; }
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
            return Robots == null || Robots.AllowsVisitToUrl(url);
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
