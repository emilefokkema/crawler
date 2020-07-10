using System;

namespace Crawler.Robots.UrlMatchers
{
    public class Nothing: UrlMatcher
    {
        public override bool Matches(Uri url)
        {
            return false;
        }
    }
}
