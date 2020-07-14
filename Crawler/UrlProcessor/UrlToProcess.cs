using System;

namespace Crawler.UrlProcessor
{
    public class UrlToProcess
    {
        public Uri Url { get; }

        public UrlToProcess(Uri url)
        {
            Url = url;
        }
    }
}
