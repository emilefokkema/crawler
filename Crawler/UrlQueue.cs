using System.Collections.Concurrent;

namespace Crawler
{
    public class UrlQueue: IUrlQueue
    {
        private readonly ConcurrentQueue<string> _urls;

        public UrlQueue()
        {
            _urls = new ConcurrentQueue<string>();
        }

        public bool TryRead(out string url)
        {
            return _urls.TryDequeue(out url);
        }

        public void Add(string url)
        {
            _urls.Enqueue(url);
        }
    }
}
