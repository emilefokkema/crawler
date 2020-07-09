using System;

namespace Crawler
{
    public interface IUrlQueue
    {
        bool TryDequeue(out Uri url);
        bool TryPeek(out Uri url);
        void Add(Uri url);
    }
}
