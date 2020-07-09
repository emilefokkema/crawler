using System.Collections.Concurrent;
using System.Linq;
using System;

namespace Crawler
{
    public class UrlQueue: IUrlQueue
    {
        private readonly ConcurrentQueue<Uri> _urls;

        public UrlQueue()
        {
            _urls = new ConcurrentQueue<Uri>();
        }

        public bool TryDequeue(out Uri url)
        {
            return _urls.TryDequeue(out url);
        }

        public bool TryPeek(out Uri url)
        {
            return _urls.TryPeek(out url);
        }

        public void Add(Uri url)
        {
            if (_urls.Contains(url))
            {
                return;
            }
            _urls.Enqueue(url);
        }
    }
}
