using System;

namespace Crawler
{
    public interface IUrlQueue
    {
        int Count { get; }
        bool TryDequeue(out Uri url);
        bool TryPeek(out Uri url);
        void Add(Uri url);
    }
}
