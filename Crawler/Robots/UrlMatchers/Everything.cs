using System;

namespace Crawler.Robots.UrlMatchers
{
    public class Everything: UrlMatcher
    {
        public override bool IsMoreSpecificThan(UrlMatcher other)
        {
            return !(other is PathUrlMatcher);
        }
        public override bool Matches(Uri url)
        {
            return true;
        }
    }
}
