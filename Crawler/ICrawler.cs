using System;

namespace Crawler
{
    public interface ICrawler
    {
        event EventHandler<ProcessedUrlEventArgs> ProcessedUrl;
        bool ProcessUrl();
    }
}
