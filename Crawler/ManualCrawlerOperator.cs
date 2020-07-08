using System;
using System.Threading.Tasks;

namespace Crawler
{
    public class ManualCrawlerOperator
    {
        private readonly ICrawler _crawler;
        public ManualCrawlerOperator(ICrawler crawler)
        {
            _crawler = crawler;
        }

        public async Task Start()
        {
            while (true)
            {
                Console.WriteLine("Press p to process a url, or q to quit");
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
                default: return ManualAction.Unknown;
            }
        }
    }
}
