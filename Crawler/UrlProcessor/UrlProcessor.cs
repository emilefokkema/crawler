using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Crawler.Logging;
using Crawler.Robots;

namespace Crawler.UrlProcessor
{
    public class UrlProcessor
    {
        private readonly UrlToProcess _urlToProcess;
        private readonly Web _web;
        private readonly IClient _client;
        private readonly List<IResultConsumer> _consumers;
        private readonly ILogger _logger;
        private readonly IRobots _robots;

        public UrlProcessor(UrlToProcess urlToProcess, Web web, IClient client, IEnumerable<IResultConsumer> consumers, ILogger logger, IRobots robots)
        {
            _urlToProcess = urlToProcess;
            _web = web;
            _client = client;
            _logger = logger;
            _robots = robots;
            _consumers = consumers.ToList();
        }

        public async Task Process()
        {
            await VisitDomain();
            if (!_web.AllowsVisitToUrl(_urlToProcess.Url))
            {
                _logger.LogWarning($"domain does not allow visiting");
                return;
            }

            var result = await _client.Get(_urlToProcess.Url);
            foreach (var consumer in _consumers)
            {
                consumer.Consume(result);
            }
        }

        private async Task VisitDomain()
        {
            Domain domain;
            while (!_web.TryGetDomainForUrl(_urlToProcess.Url, out domain))
            {
                _logger.LogDebug("could not get domain for url to add robots to it");
                
            }

            await _robots.AddRulesToDomain(domain);
        }
    }
}
