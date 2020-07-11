using System;
using System.Collections.Generic;
using System.Linq;
using Crawler.Robots.UrlMatchers;

namespace Crawler.Robots
{
    public class RobotsRule: IRobotsRule
    {
        private readonly List<UrlMatcher> _allowed;
        private readonly List<UrlMatcher> _disallowed;

        public RobotsRule(List<UrlMatcher> allowed, List<UrlMatcher> disallowed)
        {
            _allowed = allowed;
            _disallowed = disallowed;
        }

        public bool AllowsVisitToUrl(Uri url)
        {
            var disallowedMatch = _disallowed.FirstOrDefault(matcher => matcher.Matches(url));
            if (disallowedMatch == null) 
            {
                return true;
            }
            var allowedMatch = _allowed.FirstOrDefault(matcher => matcher.Matches(url));
            if (allowedMatch == null) 
            {
                return false;
            }
            return allowedMatch.IsMoreSpecificThan(disallowedMatch);
        }
    }
}
