using System;

namespace Crawler
{
    public class ErrorResult: Result
    {
        public string Message { get; }

        public ErrorResult(Exception e):this(e.Message)
        {
            
        }

        public ErrorResult(string message)
        {
            Success = false;
            Message = message;
        }
    }
}
