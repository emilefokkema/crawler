using System;
using System.Threading.Tasks;
using Crawler.Logging;

namespace Crawler
{
    public class ManualCrawlerOperator
    {
        private readonly ICrawler _crawler;
        private readonly IUrlQueue _urlQueue;
        private readonly IColoredLineWriter _coloredLineWriter;
        private readonly int _noUrlsAtATime;
        public ManualCrawlerOperator(ICrawler crawler, IUrlQueue urlQueue, IColoredLineWriter coloredLineWriter)
        {
            _crawler = crawler;
            _urlQueue = urlQueue;
            _coloredLineWriter = coloredLineWriter;
            _noUrlsAtATime = 2;
        }

        public async Task Start()
        {
            while (true)
            {
                _coloredLineWriter.WriteLine($"Press p to process a url, or q to quit ({_urlQueue.Count} left to process)", ConsoleColor.White);


                ManualAction action = GetKnownAction();
                if (action == ManualAction.Quit)
                {
                    Quit();
                    return;
                }
                if (action == ManualAction.Process)
                {
                    await ProcessUrls();
                }else if (action == ManualAction.Skip)
                {
                    if(_urlQueue.TryDequeue(out var dequeued))
                    {
                        _urlQueue.Add(dequeued);
                    }
                }
            }
        }

        private async Task ProcessUrls()
        {
            int noBeingProcessed = 0;
            int noProcessed = 0;
            for (int i = 0; i < _noUrlsAtATime; i++) 
            {
                if (_crawler.ProcessUrl())
                {
                    noBeingProcessed++;
                }
            }
            var source = new TaskCompletionSource<object>();
            EventHandler<ProcessedUrlEventArgs> handler = (s, e) =>
            {
                noProcessed++;
                if (noProcessed >= noBeingProcessed)
                {
                    source.SetResult(null);
                }
            };
            _crawler.ProcessedUrl += handler;
            await source.Task;
            _crawler.ProcessedUrl -= handler;
        }

        private void Quit()
        {
            _coloredLineWriter.WriteLine("bye", ConsoleColor.White);
        }

        private ManualAction GetKnownAction()
        {
            ManualAction result = ManualAction.Unknown;
            while (result == ManualAction.Unknown)
            {
                result = GetAction(Console.ReadKey(true));
            }

            return result;
        }

        private ManualAction GetAction(ConsoleKeyInfo keyInfo)
        {
            switch (keyInfo.KeyChar)
            {
                case 'p': return ManualAction.Process;
                case 'q': return ManualAction.Quit;
                case 's': return ManualAction.Skip;
                default: return ManualAction.Unknown;
            }
        }
    }
}
