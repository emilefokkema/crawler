using System.Collections.Generic;
using System.Linq;

namespace Crawler
{
    public class Web : ILinkConsumer
    {
        private readonly IUrlQueue _urlQueue;
        private List<Link> _links;

        public Web(IUrlQueue urlQueue)
        {
            _urlQueue = urlQueue;
            _links = new List<Link>();
        }

        public void Consume(Link link)
        {
            if (_links.Any(l => l.From.Equals(link.To)))
            {
                return;
            }

            _urlQueue.Add(link.To);
        }
    }
}
