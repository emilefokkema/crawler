using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Crawler.UrlProcessor
{
    public class UrlProcessor
    {
        private readonly UrlToProcess _urlToProcess;
        private readonly Web _web;
        private readonly IClient _client;
        private readonly List<IResultConsumer> _consumers;

        public UrlProcessor(UrlToProcess urlToProcess, Web web, IClient client, IEnumerable<IResultConsumer> consumers)
        {
            _urlToProcess = urlToProcess;
            _web = web;
            _client = client;
            _consumers = consumers.ToList();
        }

        public async Task Process()
        {
            await _web.VisitDomain(_urlToProcess.Url);
            if (!_web.AllowsVisitToUrl(_urlToProcess.Url))
            {
                return;
            }

            var result = await _client.Get(_urlToProcess.Url);
            foreach (var consumer in _consumers)
            {
                consumer.Consume(result);
            }
        }
    }
}
