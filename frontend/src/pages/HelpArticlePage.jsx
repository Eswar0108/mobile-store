import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { formatDate } from '../lib/utils';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function HelpArticlePage() {
  const { id } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['help-article', id],
    queryFn: () => api.get(`/help/${id}`).then((r) => r.data),
  });

  const feedbackMutation = useMutation({
    mutationFn: (helpful) => api.post(`/help/${id}/feedback`, { helpful }),
    onSuccess: () => toast.success('Thanks for your feedback!'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!article) return <div className="text-center py-20 text-gray-500">Article not found</div>;

  return (
    <>
      <Helmet><title>{article.title} — Help Centre — MobileStore</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-xs text-gray-400 mb-2">{article.category}</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
        <p className="text-xs text-gray-400 mb-6">Updated {formatDate(article.updatedAt)}</p>

        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
          {article.body}
        </div>

        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-600 mb-3">Was this article helpful?</p>
          <div className="flex gap-3">
            <button onClick={() => feedbackMutation.mutate(true)} className="btn-secondary text-sm py-2 px-4">👍 Yes</button>
            <button onClick={() => feedbackMutation.mutate(false)} className="btn-secondary text-sm py-2 px-4">👎 No</button>
          </div>
        </div>
      </div>
    </>
  );
}
