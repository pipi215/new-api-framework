/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Input,
  Button,
  Table,
  Progress,
  Banner,
  Spin,
  Typography,
  Empty,
} from '@douyinfe/semi-ui';
import { IconSearch, IconKey } from '@douyinfe/semi-icons';
import { API, showError, renderQuota, timestamp2string } from '../../helpers';

const UsageToken = () => {
  const { t } = useTranslation();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleQuery = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      showError(t('请输入令牌'));
      return;
    }
    setLoading(true);
    setUsage(null);
    setLogs([]);
    try {
      const authKey = trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
      const headers = { Authorization: authKey };

      const [usageRes, logsRes] = await Promise.all([
        API.get('/api/usage/token/', { headers }),
        API.get('/api/log/token', { headers }),
      ]);

      const usageBody = usageRes.data;
      if (usageBody.code !== true) {
        showError(usageBody.message || t('无效的令牌'));
        setLoading(false);
        return;
      }
      setUsage(usageBody.data);

      const logsBody = logsRes.data;
      if (logsBody.success === true) {
        setLogs(logsBody.data || []);
      }
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || t('请求失败'));
    }
    setLoading(false);
  };

  const total = usage ? usage.total_granted : 0;
  const used = usage ? usage.total_used : 0;
  const remaining = usage ? usage.total_available : 0;
  const usedPercent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  const columns = [
    {
      title: t('时间'),
      dataIndex: 'created_at',
      render: (val) => timestamp2string(val),
    },
    {
      title: t('模型'),
      dataIndex: 'model_name',
      render: (val) => val || '-',
    },
    {
      title: t('令牌数'),
      dataIndex: 'prompt_tokens',
      render: (val, record) =>
        (record.prompt_tokens || 0) + (record.completion_tokens || 0),
    },
    {
      title: t('额度'),
      dataIndex: 'quota',
      render: (val) => renderQuota(val),
    },
    {
      title: t('耗时'),
      dataIndex: 'use_time',
      render: (val) => (val != null ? `${val}s` : '-'),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <IconKey size='large' />
        <Typography.Title heading={3} style={{ margin: 0 }}>
          {t('令牌查询')}
        </Typography.Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            type='password'
            placeholder={t('请输入令牌 (sk-...)')}
            value={key}
            onChange={(value) => setKey(value)}
            onEnterPress={handleQuery}
            autoComplete='off'
            style={{ flex: 1 }}
          />
          <Button
            theme='solid'
            icon={<IconSearch />}
            loading={loading}
            onClick={handleQuery}
          >
            {t('查询')}
          </Button>
        </div>
      </Card>

      <Spin spinning={loading}>
        {usage && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Typography.Title heading={5} style={{ display: 'inline' }}>
                {usage.name || t('令牌')}
              </Typography.Title>
              {usage.unlimited_quota && (
                <Banner
                  type='info'
                  description={t('无限额度')}
                  style={{ marginLeft: 8, display: 'inline-block' }}
                />
              )}
            </div>
            {!usage.unlimited_quota && (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Typography.Text type='tertiary'>
                    {t('已用')} / {t('总额度')}
                  </Typography.Text>
                  <Typography.Text strong>
                    {renderQuota(used)} / {renderQuota(total)}
                  </Typography.Text>
                </div>
                <Progress percent={usedPercent} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 4,
                  }}
                >
                  <Typography.Text type='tertiary' size='small'>
                    {t('已用')}: {renderQuota(used)} ({usedPercent}%)
                  </Typography.Text>
                  <Typography.Text type='tertiary' size='small'>
                    {t('剩余')}: {renderQuota(remaining)} ({100 - usedPercent}%)
                  </Typography.Text>
                </div>
              </>
            )}
            <div style={{ marginTop: 8 }}>
              <Typography.Text type='tertiary'>{t('过期时间')}: </Typography.Text>
              <Typography.Text>
                {usage.expires_at ? timestamp2string(usage.expires_at) : t('永不过期')}
              </Typography.Text>
            </div>
          </Card>
        )}

        {usage && (
          <Card title={t('最近使用记录')}>
            {logs.length === 0 ? (
              <Empty description={t('暂无记录')} />
            ) : (
              <Table columns={columns} dataSource={logs} pagination={false} rowKey='id' />
            )}
          </Card>
        )}
      </Spin>
    </>
  );
};

export default UsageToken;
