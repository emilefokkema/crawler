using System;

namespace Crawler
{
    public class ProcessedUrlEventArgs: EventArgs
    {
        public Uri Url { get; }

        public ProcessedUrlEventArgs(Uri url)
        {
            Url = url;
        }
    }
}
