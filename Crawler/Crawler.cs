using System;
using System.Threading.Tasks;
using Crawler.UrlProcessor;

namespace Crawler
{
    public class Crawler: ICrawler
    {
        public event EventHandler<ProcessedUrlEventArgs> ProcessedUrl;
        private readonly IUrlQueue _urlQueue;
        private readonly IUrlProcessorFactory _urlProcessorFactory;
        public Crawler(IUrlQueue urlQueue, IUrlProcessorFactory urlProcessorFactory)
        {
            _urlQueue = urlQueue;
            _urlProcessorFactory = urlProcessorFactory;
        }

        public bool ProcessUrl()
        {
            if (!_urlQueue.TryDequeue(out Uri url))
            {
                return false;
            }

            Task.Run(async () =>
            {
                try
                {
                    var urlProcessor = _urlProcessorFactory.Create(url);
                    await urlProcessor.Process();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }
                finally
                {
                    ProcessedUrl?.Invoke(this, new ProcessedUrlEventArgs(url));
                }
            });
            return true;
        }
    }
}
