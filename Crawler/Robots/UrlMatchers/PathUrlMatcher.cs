using System;
using System.Text.RegularExpressions;

namespace Crawler.Robots.UrlMatchers
{
    public class PathUrlMatcher: UrlMatcher
    {
        private Regex _regex;
        public string UrlPattern { get; }
        public override bool Matches(Uri url)
        {
            return _regex.IsMatch(url.ToString());
        }
        public override bool IsMoreSpecificThan(UrlMatcher other)
        {
            if (other is PathUrlMatcher otherPath) 
            {
                return otherPath.UrlPattern.Length < UrlPattern.Length;
            }
            return true;
        }

        public PathUrlMatcher(string robotsUrlPattern)
        {
            UrlPattern = robotsUrlPattern;
            _regex = new Regex($"^.*{robotsUrlPattern}.*$");
        }
    }
}
