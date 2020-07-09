using System;
using Crawler.Robots;

namespace Crawler
{
    public class Domain
    {
        private IRobotsRule _robotsRule;
        public string Host { get; }
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

        public void SetRobotsRule(IRobotsRule rule)
        {
            if (rule == null)
            {
                return;
            }

            _robotsRule = rule;
        }

        public bool HasRobotsRule()
        {
            return _robotsRule != null;
        }

        public static Domain CreateForUrl(Uri url)
        {
            Uri domainUrl = new Uri($"{url.Scheme}://{url.Host}");
            return new Domain(url.Host, domainUrl);
        }
    }
}
