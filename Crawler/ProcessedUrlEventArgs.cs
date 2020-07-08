using System;

namespace Crawler
{
    public class ProcessedUrlEventArgs: EventArgs
    {
        public string Url { get; }

        public ProcessedUrlEventArgs(string url)
        {
            Url = url;
        }
    }
}
