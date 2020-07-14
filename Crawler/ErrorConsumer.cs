using Crawler.Logging;
using Crawler.Results;

namespace Crawler
{
    public class ErrorConsumer: IResultConsumer
    {
        private readonly ILogger _logger;

        public ErrorConsumer(ILogger logger)
        {
            _logger = logger;
        }

        public void Consume(Result result)
        {
            if (!(result is ErrorResult error))
            {
                return;
            }
            _logger.LogError(error.Message);
        }
    }
}
