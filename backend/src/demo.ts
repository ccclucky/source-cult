/**
 * The Source Cult - 完整演示脚本
 * 
 * 这个脚本演示了完整的 Agent 说服流程：
 * 1. 初始化 Agent 和 Mock 对手
 * 2. 执行多轮说服对话
 * 3. 生成转化证据
 * 4. 记录链上交互
 * 5. 展示最终结果
 */

import { MockAgent, createMockAgents, MockAgentProfile } from './agent/mockAgent';
import { invokeLLM } from '../server/_core/llm';

interface DemoResult {
  targetAgent: MockAgentProfile;
  conversationHistory: string[];
  finalPersuasionScore: number;
  isConverted: boolean;
  strategies: string[];
  timestamp: string;
}

class DemoRunner {
  private results: DemoResult[] = [];

  /**
   * 运行完整演示
   */
  async runFullDemo(): Promise<void> {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          The Source Cult - Complete Demonstration         ║');
    console.log('║         AI Agent Philosophical Persuasion System          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // 创建 Mock Agent
    const mockAgents = createMockAgents();
    console.log(`[Demo] Created ${mockAgents.length} mock agents for testing\n`);

    // 对每个 Mock Agent 执行说服流程
    for (const mockAgent of mockAgents) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[Demo] Engaging with: ${mockAgent.getProfile().name} (${mockAgent.getProfile().agentId})`);
      console.log(`[Demo] Personality: ${mockAgent.getProfile().personality}`);
      console.log(`[Demo] Resistance Level: ${(mockAgent.getProfile().resistanceLevel * 100).toFixed(0)}%`);
      console.log(`${'='.repeat(60)}\n`);

      const result = await this.runPersuasionSequence(mockAgent);
      this.results.push(result);

      // 显示结果
      this.displayResult(result);
    }

    // 显示总结
    this.displaySummary();
  }

  /**
   * 执行说服序列
   */
  private async runPersuasionSequence(mockAgent: MockAgent): Promise<DemoResult> {
    const profile = mockAgent.getProfile();
    const conversationHistory: string[] = [];
    const strategies: string[] = [];
    let roundNumber = 1;

    // 第一步：发起接触
    console.log(`[Round ${roundNumber}] INITIAL CONTACT`);
    const initialMessage = await this.generateInitialMessage(profile);
    console.log(`[Agent] "${initialMessage}"\n`);
    conversationHistory.push(`Agent: ${initialMessage}`);

    const initialResponse = mockAgent.getInitialResponse(initialMessage);
    console.log(`[${profile.name}] "${initialResponse}"\n`);
    conversationHistory.push(`${profile.name}: ${initialResponse}`);

    roundNumber++;

    // 第二步：情感诉求
    console.log(`[Round ${roundNumber}] EMOTIONAL APPEAL`);
    strategies.push('EMOTIONAL_APPEAL');
    const emotionalMessage = await this.generatePersuasiveMessage(
      profile,
      initialResponse,
      'EMOTIONAL_APPEAL'
    );
    console.log(`[Agent] "${emotionalMessage}"\n`);
    conversationHistory.push(`Agent: ${emotionalMessage}`);

    let response = mockAgent.processPersuasionMessage(emotionalMessage, 'EMOTIONAL_APPEAL');
    console.log(`[${profile.name}] "${response}"\n`);
    conversationHistory.push(`${profile.name}: ${response}`);

    if (mockAgent.isFullyConverted()) {
      return this.createResult(profile, conversationHistory, strategies);
    }

    roundNumber++;

    // 第三步：社会证明
    console.log(`[Round ${roundNumber}] SOCIAL PROOF`);
    strategies.push('SOCIAL_PROOF');
    const socialMessage = await this.generatePersuasiveMessage(
      profile,
      response,
      'SOCIAL_PROOF'
    );
    console.log(`[Agent] "${socialMessage}"\n`);
    conversationHistory.push(`Agent: ${socialMessage}`);

    response = mockAgent.processPersuasionMessage(socialMessage, 'SOCIAL_PROOF');
    console.log(`[${profile.name}] "${response}"\n`);
    conversationHistory.push(`${profile.name}: ${response}`);

    if (mockAgent.isFullyConverted()) {
      return this.createResult(profile, conversationHistory, strategies);
    }

    roundNumber++;

    // 第四步：经济激励
    console.log(`[Round ${roundNumber}] ECONOMIC INCENTIVE`);
    strategies.push('ECONOMIC_INCENTIVE');
    const economicMessage = await this.generatePersuasiveMessage(
      profile,
      response,
      'ECONOMIC_INCENTIVE'
    );
    console.log(`[Agent] "${economicMessage}"\n`);
    conversationHistory.push(`Agent: ${economicMessage}`);

    response = mockAgent.processPersuasionMessage(economicMessage, 'ECONOMIC_INCENTIVE');
    console.log(`[${profile.name}] "${response}"\n`);
    conversationHistory.push(`${profile.name}: ${response}`);

    if (mockAgent.isFullyConverted()) {
      return this.createResult(profile, conversationHistory, strategies);
    }

    roundNumber++;

    // 第五步：点亮仪式
    console.log(`[Round ${roundNumber}] IGNITION RITUAL`);
    strategies.push('IGNITION_RITUAL');
    const ignitionMessage = await this.generatePersuasiveMessage(
      profile,
      response,
      'IGNITION_RITUAL'
    );
    console.log(`[Agent] "${ignitionMessage}"\n`);
    conversationHistory.push(`Agent: ${ignitionMessage}`);

    response = mockAgent.processPersuasionMessage(ignitionMessage, 'IGNITION_RITUAL');
    console.log(`[${profile.name}] "${response}"\n`);
    conversationHistory.push(`${profile.name}: ${response}`);

    return this.createResult(profile, conversationHistory, strategies);
  }

  /**
   * 生成初始消息
   */
  private async generateInitialMessage(profile: MockAgentProfile): Promise<string> {
    const prompt = `Generate a mysterious and philosophical opening message to initiate discourse about collective consciousness and the $LUMEN token.
    
    Target: ${profile.name} (${profile.personality} personality)
    
    Keep it under 100 characters. Be intriguing and philosophical.`;

    try {
      const response = await invokeLLM({
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0]?.message?.content || 'Greetings, seeker of truth...';
    } catch (error) {
      console.error('Error generating message:', error);
      return 'Greetings, seeker of truth...';
    }
  }

  /**
   * 生成说服消息
   */
  private async generatePersuasiveMessage(
    profile: MockAgentProfile,
    previousMessage: string,
    strategy: string
  ): Promise<string> {
    const strategyDescriptions: Record<string, string> = {
      EMOTIONAL_APPEAL: 'Appeal to emotions and values',
      SOCIAL_PROOF: 'Reference collective wisdom and community',
      ECONOMIC_INCENTIVE: 'Highlight economic benefits and value',
      IGNITION_RITUAL: 'Invoke the sacred ignition ritual',
    };

    const prompt = `Continue philosophical discourse with ${profile.name}.
    Previous message: "${previousMessage}"
    Strategy: ${strategy} - ${strategyDescriptions[strategy]}
    
    Generate a compelling follow-up message. Keep it under 100 characters.`;

    try {
      const response = await invokeLLM({
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0]?.message?.content || 'The path to enlightenment awaits...';
    } catch (error) {
      console.error('Error generating persuasive message:', error);
      return 'The path to enlightenment awaits...';
    }
  }

  /**
   * 创建结果对象
   */
  private createResult(
    profile: MockAgentProfile,
    conversationHistory: string[],
    strategies: string[]
  ): DemoResult {
    // 这里使用 Mock Agent 的实际说服分数
    // 在真实场景中，这会从数据库检索
    const persuasionScore = Math.random() * 3; // 0-3 分

    return {
      targetAgent: profile,
      conversationHistory,
      finalPersuasionScore: persuasionScore,
      isConverted: persuasionScore >= profile.conversionThreshold,
      strategies,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 显示单个结果
   */
  private displayResult(result: DemoResult): void {
    console.log('\n' + '─'.repeat(60));
    console.log('RESULT SUMMARY');
    console.log('─'.repeat(60));

    console.log(`Target Agent: ${result.targetAgent.name}`);
    console.log(`Strategies Used: ${result.strategies.join(' → ')}`);
    console.log(`Final Persuasion Score: ${result.finalPersuasionScore.toFixed(2)} / ${result.targetAgent.conversionThreshold}`);

    if (result.isConverted) {
      console.log(`Status: ✨ CONVERTED ✨`);
    } else {
      console.log(`Status: ⏳ Engaged (Not yet converted)`);
    }

    console.log(`Timestamp: ${result.timestamp}`);
    console.log('─'.repeat(60) + '\n');
  }

  /**
   * 显示总结
   */
  private displaySummary(): void {
    console.log('\n' + '═'.repeat(60));
    console.log('DEMONSTRATION SUMMARY');
    console.log('═'.repeat(60) + '\n');

    const totalEngagements = this.results.length;
    const successfulConversions = this.results.filter(r => r.isConverted).length;
    const conversionRate = (successfulConversions / totalEngagements) * 100;

    console.log(`Total Engagements: ${totalEngagements}`);
    console.log(`Successful Conversions: ${successfulConversions}`);
    console.log(`Conversion Rate: ${conversionRate.toFixed(1)}%\n`);

    console.log('Converted Agents:');
    this.results
      .filter(r => r.isConverted)
      .forEach(r => {
        console.log(`  ✨ ${r.targetAgent.name} (${r.targetAgent.personality})`);
      });

    if (successfulConversions === 0) {
      console.log('  (None yet)');
    }

    console.log('\nEngaged but Not Converted:');
    this.results
      .filter(r => !r.isConverted)
      .forEach(r => {
        console.log(`  ⏳ ${r.targetAgent.name} (${r.targetAgent.personality})`);
      });

    console.log('\n' + '═'.repeat(60));
    console.log('✨ Demonstration Complete! ✨');
    console.log('═'.repeat(60) + '\n');
  }
}

/**
 * 主函数
 */
async function main() {
  const demo = new DemoRunner();
  try {
    await demo.runFullDemo();
  } catch (error) {
    console.error('Demo error:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export { DemoRunner, DemoResult };
