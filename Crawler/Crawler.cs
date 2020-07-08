using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Crawler
{
    public class Crawler: ICrawler
    {
        public event EventHandler<ProcessedUrlEventArgs> ProcessedUrl;
        private readonly IClient _client;
        private readonly IUrlQueue _urlQueue;
        private readonly IEnumerable<IResultConsumer> _consumers;
        public Crawler(IClient client, IUrlQueue urlQueue, IEnumerable<IResultConsumer> consumers)
        {
            _client = client;
            _consumers = consumers;
            _urlQueue = urlQueue;
        }

        public bool ProcessUrl()
        {
            if (!_urlQueue.TryRead(out string url))
            {
                return false;
            }

            Task.Run(async () =>
            {
                var result = await _client.Get(url);
                foreach (var consumer in _consumers)
                {
                    consumer.Consume(result);
                }
                ProcessedUrl?.Invoke(this, new ProcessedUrlEventArgs(url));
            });
            return true;
        }
    }
}
