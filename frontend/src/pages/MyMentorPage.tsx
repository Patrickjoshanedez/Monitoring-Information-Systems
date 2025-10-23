import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import MentorTable from '../components/mentee/MentorTable';

interface Mentor {
  id: string;
  name: string;
  institutionalId: string;
  subject: string;
  schedule: string;
  status: 'In Progress' | 'Completed';
}

const MyMentorPage: React.FC = () => {
  // Mock data for current mentors
  const currentMentors: Mentor[] = [
    {
      id: '1',
      name: 'Taylor Swift',
      institutionalId: '2301104775@student.buksu.edu.ph',
      subject: 'Computer Programming',
      schedule: 'Wed 10:00am-12:00pm',
      status: 'In Progress'
    },
    {
      id: '2',
      name: 'Justin Beiber',
      institutionalId: '2301104776@student.buksu.edu.ph',
      subject: 'Database',
      schedule: 'Thu 2:00pm-4:00pm',
      status: 'In Progress'
    },
    {
      id: '3',
      name: 'james Reid',
      institutionalId: '2301104777@student.buksu.edu.ph',
      subject: 'Networking',
      schedule: 'Fri 9:00am-11:00am',
      status: 'In Progress'
    }
  ];

  // Mock data for recent mentors
  const recentMentors: Mentor[] = [
    {
      id: '4',
      name: 'Sarah Johnson',
      institutionalId: '2301104778@student.buksu.edu.ph',
      subject: 'Web Development',
      schedule: 'Mon 1:00pm-3:00pm',
      status: 'Completed'
    },
    {
      id: '5',
      name: 'Michael Chen',
      institutionalId: '2301104779@student.buksu.edu.ph',
      subject: 'Data Structures',
      schedule: 'Tue 10:00am-12:00pm',
      status: 'Completed'
    },
    {
      id: '6',
      name: 'Emily Davis',
      institutionalId: '2301104780@student.buksu.edu.ph',
      subject: 'Software Engineering',
      schedule: 'Wed 3:00pm-5:00pm',
      status: 'Completed'
    }
  ];

  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Current Mentors Section */}
        <MentorTable
          mentors={currentMentors}
          title="Current Mentors"
          showSearch={true}
          showSort={true}
        />

        {/* Recent Mentors Section */}
        <MentorTable
          mentors={recentMentors}
          title="Recent Mentors"
          showSearch={false}
          showSort={true}
        />
      </div>
    </DashboardLayout>
  );
};

export default MyMentorPage;

