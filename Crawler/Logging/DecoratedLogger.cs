using System;
using Crawler.UrlProcessor;

namespace Crawler.Logging
{
    public class DecoratedLogger: ILogger
    {
        private readonly ILogger _logger;
        private readonly UrlToProcess _urlToProcess;

        public DecoratedLogger(ILogger logger, UrlToProcess urlToProcess)
        {
            _logger = logger;
            _urlToProcess = urlToProcess;
        }

        private string DecorateMessage(string message)
        {
            return $"[{_urlToProcess.Url}] {message}";
        }

        public void LogDebug(string message)
        {
            _logger.LogDebug(DecorateMessage(message));
        }

        public void LogInfo(string message)
        {
            _logger.LogInfo(DecorateMessage(message));
        }

        public void LogWarning(string message)
        {
            _logger.LogWarning(DecorateMessage(message));
        }

        public void LogError(string message)
        {
            _logger.LogError(DecorateMessage(message));
        }
    }
}
