import { NextRequest, NextResponse } from 'next/server';

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다.' },
      { status: 400 }
    );
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: '네이버 API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const searchQuery = `${query} 맛집 후기`;
    const params = new URLSearchParams({
      query: searchQuery,
      display: '5',
      sort: 'sim',
    });

    const response = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?${params}`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '네이버 블로그 검색에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    const reviews = data.items.map(
      (item: {
        title: string;
        description: string;
        bloggername: string;
        postdate: string;
        link: string;
      }) => ({
        title: stripHtml(item.title),
        description: stripHtml(item.description),
        bloggerName: item.bloggername,
        date: item.postdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3'),
        link: item.link,
      })
    );

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json(
      { error: '블로그 후기를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
