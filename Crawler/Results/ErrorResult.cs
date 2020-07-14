using System;

namespace Crawler.Results
{
    public class ErrorResult: Result
    {
        public string Message { get; }

        public ErrorResult(string msg, Exception e):this(msg + ": " + e.Message)
        {
            
        }

        public ErrorResult(string message)
        {
            Message = message;
        }
    }
}
