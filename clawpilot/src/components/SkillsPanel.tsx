import React from 'react';
import { useGatewayWs } from '../hooks/useGatewayWs';

const SkillsPanel: React.FC = () => {
  const { skills, send } = useGatewayWs();

  const runSkill = (skillName: string) => {
    send('chat.send', { message: `Run skill: ${skillName}` });
  };

  const toggleSkill = (skillName: string, isEnabled: boolean) => {
    const type = isEnabled ? 'skills.disable' : 'skills.enable';
    send(type, { skill: skillName });
  };

  const hardcodedSkills = [
    { name: 'Daily Summary', description: 'Generate a daily summary.' },
    { name: 'Code Review', description: 'Review my latest code changes.' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Skills</h1>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Available Skills</h2>
        {skills.map((skill) => (
          <div key={skill.name} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{skill.name}</h3>
                <p className="text-sm text-gray-600">{skill.description}</p>
              </div>
              <button
                onClick={() => toggleSkill(skill.name, skill.enabled)}
                className={`px-4 py-2 rounded-md text-white font-semibold ${
                  skill.enabled ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'
                }`}>
                {skill.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
        <h2 className="text-2xl font-bold mb-4 mt-8">Manual Triggers</h2>
        {hardcodedSkills.map((skill) => (
          <div key={skill.name} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{skill.name}</h3>
                <p className="text-sm text-gray-600">{skill.description}</p>
              </div>
              <button
                onClick={() => runSkill(skill.name)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Run Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPanel;