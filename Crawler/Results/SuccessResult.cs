using System;

namespace Crawler.Results
{
    public class SuccessResult: Result
    {
        public Uri Url { get; }
        public string Content { get; }

        public SuccessResult(Uri url, string content)
        {
            Url = url;
            Content = content;
        }
    }
}
