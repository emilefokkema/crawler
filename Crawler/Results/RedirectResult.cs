using System;

namespace Crawler.Results
{
    public class RedirectResult: Result
    {
        public Uri OriginalLocation { get; }
        public Uri Location { get; }

        public RedirectResult(Uri originalLocation, Uri location)
        {
            OriginalLocation = originalLocation;
            Location = location;
        }
    }
}
