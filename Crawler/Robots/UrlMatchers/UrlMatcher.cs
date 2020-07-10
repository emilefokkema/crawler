using System;
using System.Text.RegularExpressions;

namespace Crawler.Robots.UrlMatchers
{
    public abstract class UrlMatcher
    {
        public abstract bool Matches(Uri url);
        public static bool TryParse(string matcher, out UrlMatcher result)
        {
            if (string.IsNullOrWhiteSpace(matcher))
            {
                result = new Nothing();
                return true;
            }

            if (new Regex(@"^\s*/\s*$").IsMatch(matcher))
            {
                result = new Everything();
                return true;
            }

            result = new PathUrlMatcher(matcher);
            return true;
        }
    }
}
