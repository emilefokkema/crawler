using System;

namespace Crawler
{
    public interface IUrlQueue
    {
        int Count { get; }
        bool TryDequeue(out Uri url);
        void Add(Uri url);
    }
}
