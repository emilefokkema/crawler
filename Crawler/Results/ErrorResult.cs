using System;

namespace Crawler.Results
{
    public class ErrorResult: Result
    {
        public string Message { get; }

        public ErrorResult(Exception e):this(e.Message)
        {
            
        }

        public ErrorResult(string message)
        {
            Message = message;
        }
    }
}
