using System;

namespace Crawler
{
    public class Link
    {
        public Uri From { get; }
        public Uri To { get; }
        public Link(Uri from, Uri to) 
        {
            From = from;
            To = to;
        }
    }
}
