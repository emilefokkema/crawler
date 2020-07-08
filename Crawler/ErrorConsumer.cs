using System;

namespace Crawler
{
    public class ErrorConsumer: IResultConsumer
    {
        public void Consume(Result result)
        {
            if (!(result is ErrorResult error))
            {
                return;
            }
            Console.WriteLine(error.Message);
        }
    }
}
