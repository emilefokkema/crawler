using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System;
using Crawler.Logging;
using Crawler.Results;
using Crawler.UrlProcessor;

namespace Crawler
{
    public class UrlFinderConsumer: IResultConsumer
    {
        private readonly Regex _urlRegex;
        private readonly Regex _unwantedUrlRegex;
        private readonly Web _web;
        private readonly IUrlQueue _urlQueue;
        private readonly ILogger _logger;
        private readonly UrlToProcess _urlToProcess;
        public UrlFinderConsumer(Web web, ILogger logger, IUrlQueue urlQueue, UrlToProcess urlToProcess)
        {
            _logger = logger;
            _urlQueue = urlQueue;
            _urlToProcess = urlToProcess;
            _urlRegex = BuildUrlRegex();
            _unwantedUrlRegex = new Regex(@"\.(?!html?)[a-z0-9]+(?:$|\?)", RegexOptions.IgnoreCase);
            _web = web;
        }

        private static Regex BuildUrlRegex()
        {
            string domainNamePart = @"[0-9a-z_\-]+";
            string domainName = $"(?:{domainNamePart}\\.)+{domainNamePart}";
            string directory = @"[0-9a-z_\-]+";
            string fileNameBeforeExtension = @"[0-9a-z_\-+]+";
            string fileName = $"{fileNameBeforeExtension}(?:\\.[a-z0-9]+)*";
            string path = $"(?:/{directory})*/(?:{fileName})?";
            string queryParamName = @"[0-9a-z_\-]+";
            string queryParamValue = @"[0-9a-z_\-=]*";
            string queryParam = $"{queryParamName}={queryParamValue}";
            string queryString = $"\\?{queryParam}(?:&{queryParam})*";
            return new Regex($"https?://{domainName}(?:{path})?(?:{queryString})?", RegexOptions.IgnoreCase);
        }

        public void Consume(Result result)
        {
            if (result is RedirectResult redirect)
            {
                _logger.LogInfo($"Redirected to {redirect.Location}");
                AddLinks(new List<Uri>{redirect.Location});
                return;
            }

            if (!(result is SuccessResult success))
            {
                return;
            }

            List<Uri> matches = _urlRegex.Matches(success.Content).Select(m => new Uri(m.Value)).Distinct().ToList();
            matches = matches.Where(m => !m.Equals(success.Url) && !_unwantedUrlRegex.IsMatch(m.ToString())).ToList();
            AddLinks(matches);
        }

        private void AddLinks(List<Uri> urls)
        {
            List<Uri> urlsToEnqueue = urls.Where(url => !_web.ContainsLinkTarget(url)).ToList();
            _web.AddLinks(_urlToProcess.Url, urls);
            if (urlsToEnqueue.Count == 0)
            {
                _logger.LogDebug($"No new urls to enqueue");
            }
            else
            {
                _logger.LogDebug($"Adding {urlsToEnqueue.Count} urls to queue");
            }
            foreach (var urlToEnqueue in urlsToEnqueue)
            {
                _urlQueue.Add(urlToEnqueue);
            }
        }
    }
}
