'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  sendInsuranceEmail, 
  sendHealthCheckEmail, 
  sendDepartmentEmail,
  getEmailHistory,
  EMAIL_TYPES,
  type EmailType
} from '@/lib/email-service';
import { department2Api } from '@/lib/api';
import type { Hire, PersonalInfo } from '@/lib/api';
import { Mail, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

interface EmailSenderProps {
  hire: Hire;
  personalInfo?: PersonalInfo;
  className?: string;
}

interface EmailHistoryItem {
  id: string;
  email_type: EmailType;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string;
}

const EMAIL_TYPE_LABELS = {
  [EMAIL_TYPES.NEW_HIRE]: '입사예정자',
  [EMAIL_TYPES.INSURANCE]: '단체보험 담당자',
  [EMAIL_TYPES.HEALTH_CHECK]: '건강검진 담당자',
  [EMAIL_TYPES.DEPARTMENT]: '유관부서 및 해당부서장',
} as const;

const EMAIL_TYPE_COLORS = {
  [EMAIL_TYPES.NEW_HIRE]: 'bg-blue-100 text-blue-800',
  [EMAIL_TYPES.INSURANCE]: 'bg-green-100 text-green-800',
  [EMAIL_TYPES.HEALTH_CHECK]: 'bg-purple-100 text-purple-800',
  [EMAIL_TYPES.DEPARTMENT]: 'bg-orange-100 text-orange-800',
} as const;

export function EmailSender({ hire, personalInfo, className }: EmailSenderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // 이메일 발송 이력 로드
  const loadEmailHistory = async () => {
    try {
      const history = await getEmailHistory(hire.id) as EmailHistoryItem[];
      setEmailHistory(history);
      setShowHistory(true);
    } catch (error) {
      console.error('이메일 이력 조회 실패:', error);
      toast({
        title: '이력 조회 실패',
        description: '이메일 발송 이력을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    }
  };

  // 이메일 발송 함수
  const sendEmail = async (emailType: EmailType) => {
    setIsLoading(true);
    
    try {
      // 부서 정보 조회
      const departmentInfo = await department2Api.getByName(hire.department);
      
      let result;
      let recipientEmail = '';
      
      switch (emailType) {
        case EMAIL_TYPES.INSURANCE:
          // 단체보험 담당자 이메일 - 임시로 부서장 이메일 사용
          recipientEmail = departmentInfo.manager_email;
          result = await sendInsuranceEmail(hire, departmentInfo, personalInfo, recipientEmail);
          break;
          
        case EMAIL_TYPES.HEALTH_CHECK:
          // 건강검진 담당자 이메일 - 임시로 부서장 이메일 사용
          recipientEmail = departmentInfo.manager_email;
          result = await sendHealthCheckEmail(hire, departmentInfo, personalInfo, recipientEmail);
          break;
          
        case EMAIL_TYPES.DEPARTMENT:
          // 유관부서 및 해당부서장 이메일
          result = await sendDepartmentEmail(hire, departmentInfo, personalInfo);
          break;
          
        default:
          throw new Error('지원하지 않는 이메일 타입입니다.');
      }
      
      if (result.success) {
        toast({
          title: '이메일 발송 완료',
          description: `${EMAIL_TYPE_LABELS[emailType]} 이메일이 성공적으로 발송되었습니다.`,
        });
        
        // 이메일 이력 새로고침
        if (showHistory) {
          await loadEmailHistory();
        }
      } else {
        toast({
          title: '이메일 발송 실패',
          description: result.error || '이메일 발송 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('이메일 발송 에러:', error);
      toast({
        title: '이메일 발송 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  // 발송된 이메일 타입들 계산
  const sentEmailTypes = emailHistory
    .filter(h => h.status === 'sent')
    .map(h => h.email_type);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 이메일 발송 드롭다운 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="gap-1"
          >
            <Mail className="w-4 h-4" />
            이메일 발송
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => sendEmail(EMAIL_TYPES.INSURANCE)}
            disabled={isLoading}
          >
            <div className="flex items-center justify-between w-full">
              <span>단체보험 담당자</span>
              {sentEmailTypes.includes(EMAIL_TYPES.INSURANCE) && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => sendEmail(EMAIL_TYPES.HEALTH_CHECK)}
            disabled={isLoading}
          >
            <div className="flex items-center justify-between w-full">
              <span>건강검진 담당자</span>
              {sentEmailTypes.includes(EMAIL_TYPES.HEALTH_CHECK) && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => sendEmail(EMAIL_TYPES.DEPARTMENT)}
            disabled={isLoading}
          >
            <div className="flex items-center justify-between w-full">
              <span>유관부서 및 해당부서장</span>
              {sentEmailTypes.includes(EMAIL_TYPES.DEPARTMENT) && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={loadEmailHistory}>
            <Clock className="w-4 h-4 mr-2" />
            발송 이력 보기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 발송 이력 표시 */}
      {showHistory && emailHistory.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {emailHistory.slice(0, 3).map((item) => (
            <Badge 
              key={item.id}
              variant="outline"
              className={`text-xs ${EMAIL_TYPE_COLORS[item.email_type as EmailType]} border-0`}
            >
              <div className="flex items-center gap-1">
                {getStatusIcon(item.status)}
                <span className="truncate max-w-16">
                  {EMAIL_TYPE_LABELS[item.email_type as EmailType]}
                </span>
              </div>
            </Badge>
          ))}
          
          {emailHistory.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{emailHistory.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* 자동 발송된 입사예정자 이메일 표시 */}
      {sentEmailTypes.includes(EMAIL_TYPES.NEW_HIRE) && (
        <Badge className="text-xs bg-blue-100 text-blue-800 border-0">
          <CheckCircle className="w-3 h-3 mr-1" />
          자동발송 완료
        </Badge>
      )}
    </div>
  );
} 