using System;
using System.Threading.Tasks;

namespace Crawler
{
    public class ManualCrawlerOperator
    {
        private readonly ICrawler _crawler;
        private readonly IUrlQueue _urlQueue;
        public ManualCrawlerOperator(ICrawler crawler, IUrlQueue urlQueue)
        {
            _crawler = crawler;
            _urlQueue = urlQueue;
        }

        public async Task Start()
        {
            while (true)
            {
                if (_urlQueue.TryPeek(out Uri nextInLine))
                {
                    Console.WriteLine($"Press p to process {nextInLine}, q to quit or s to skip ({_urlQueue.Count} left to process)");
                }
                else
                {
                    Console.WriteLine($"Press p to process a url, or q to quit ({_urlQueue.Count} left to process)");
                }


                ManualAction action = GetKnownAction();
                if (action == ManualAction.Quit)
                {
                    Quit();
                    return;
                }
                if (action == ManualAction.Process)
                {
                    bool processed = _crawler.ProcessUrl();
                    if (processed)
                    {
                        await WhenUrlIsProcessed();
                    }
                }else if (action == ManualAction.Skip)
                {
                    if(_urlQueue.TryDequeue(out var dequeued))
                    {
                        _urlQueue.Add(dequeued);
                    }
                }
            }
        }

        private async Task WhenUrlIsProcessed()
        {
            var source = new TaskCompletionSource<object>();
            EventHandler<ProcessedUrlEventArgs> handler = (s, e) =>
            {
                source.SetResult(null);
            };
            _crawler.ProcessedUrl += handler;
            await source.Task;
            _crawler.ProcessedUrl -= handler;
        }

        private void Quit()
        {
            Console.WriteLine("bye");
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
