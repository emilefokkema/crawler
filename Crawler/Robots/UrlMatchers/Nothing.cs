using System;

namespace Crawler.Robots.UrlMatchers
{
    public class Nothing: UrlMatcher
    {
        public override bool IsMoreSpecificThan(UrlMatcher other)
        {
            return !(other is PathUrlMatcher);
        }
        public override bool Matches(Uri url)
        {
            return false;
        }
    }
}
