using System;

namespace Crawler
{
    public class SuccessResult: Result
    {
        public Uri Url { get; }
        public string Content { get; }

        public SuccessResult(Uri url, string content)
        {
            Success = true;
            Url = url;
            Content = content;
        }
    }
}
