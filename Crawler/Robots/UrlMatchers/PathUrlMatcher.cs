using System;
using System.Text.RegularExpressions;

namespace Crawler.Robots.UrlMatchers
{
    public class PathUrlMatcher: UrlMatcher
    {
        private Regex _regex;
        public override bool Matches(Uri url)
        {
            return _regex.IsMatch(url.ToString());
        }

        public PathUrlMatcher(string robotsUrlPattern)
        {
            _regex = new Regex($"^.*{robotsUrlPattern}.*$");
        }
    }
}
