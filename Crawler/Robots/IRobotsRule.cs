using System;

namespace Crawler.Robots
{
    public interface IRobotsRule
    {
        bool AllowsVisitToUrl(Uri url);
    }
}
