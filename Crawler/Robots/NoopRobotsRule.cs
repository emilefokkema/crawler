using System;

namespace Crawler.Robots
{
    public class NoopRobotsRule : IRobotsRule
    {
        public bool AllowsVisitToUrl(Uri url)
        {
            return true;
        }
    }
}
