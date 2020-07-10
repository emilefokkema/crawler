using System.Collections.Generic;
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
    }
}
