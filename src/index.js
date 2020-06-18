import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { data, totalTrackLength } from './sampleData';
import './styles.css';

/*
 *  Author: Tay Ta
 *  Email: chitayta@gmail.com
 */

// assume all data is valid and sorted by start time
const TimelineSegments = ({ data, totalTrackLength }) => {
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (containerRef.current) {
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  const updateSize = () => {
    setDimensions({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });
  };

  // Prepare and sort data before rendering
  const segmentPartitions = sortSegments(data, totalTrackLength);

  return (
    <div className="container-fluid">
      <div className="segment-container" ref={containerRef}>
        {segmentPartitions.map((sp, spIdx) => {
          return (
            <div className="segment-partition-container" key={spIdx}>
              {sp.map((s, sIdx) => {
                return (
                  <div
                    key={sIdx}
                    className="segment-item"
                    style={{
                      width: s.width.toString().concat('%'),
                      transform: 'translateX('
                        .concat(s.translateX * dimensions.width)
                        .concat('px)'),
                    }}
                  >
                    <div className="text-value">{s.start}</div>
                    <div className="text-value">{s.end}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// boilerplate
ReactDOM.render(
  <TimelineSegments data={data} totalTrackLength={totalTrackLength} />,
  document.getElementById('root')
);

/**
 * To sort and insert data element into array of sorted rows for UI rendering
 * @param {object} data the data array to be sorted
 * @param {number} totalTrackLength total track length
 *
 * @returns Array of sorted rows
 */
function sortSegments(data, totalTrackLength) {
  // Sort input data array before processing them
  data.sort((dataX, dataY) => {
    if (dataX.start < dataY.start) {
      return -1;
    }

    if (dataX.start > dataY.start) {
      return 1;
    }

    if (dataX.end < dataY.end) {
      return -1;
    }

    if (dataX.end > dataY.end) {
      return 1;
    }

    return 0;
  });

  // Return array of sorted rows
  const sortedRowsArr = [];

  // Loop through data one by one
  for (const d of data) {
    // Try inserting data into available sorted rows
    const inserted = tryInsertingDataToSortedRows(
      d,
      sortedRowsArr,
      totalTrackLength
    );

    if (inserted) {
      // It has been inserted to an available sorted row
      continue;
    } else {
      // Put it to a new row at the tailing of result array
      sortedRowsArr.push([
        {
          ...d,
          width: ((d.end - d.start) / totalTrackLength) * 100,
          translateX: d.start / totalTrackLength,
        },
      ]);
    }
  }

  return sortedRowsArr;
}

/**
 * Loop through all sorted rows and find whether the data can be inserted into any row or not.
 * If can, push it to to row with neccessary css value for UI rendering: the width and the X-translate in percentage
 *
 * @param {object} d the data
 * @param {array} sortedRowsArr list of all sorted rows
 * @param {number} totalTrackLength total track length
 *
 * @returns true if the the data has been inserted into a sorted row, false if the data cannot be inserted into any rows
 */
function tryInsertingDataToSortedRows(d, sortedRowsArr, totalTrackLength) {
  // loop throught all sorted rows
  for (const s of sortedRowsArr) {
    // only compare to last item because the input data has been sorted
    const lastItem = s[s.length - 1];
    if (d.start < lastItem.end) {
      // overlapped, so continue to compare to the next row
      continue;
    }

    // the data can be inserted to the tailing of this row
    s.push({
      ...d,
      width: calculateWidthOfDataSegment(d, totalTrackLength),
      translateX: calculateTranslateXInPercent(d, s, totalTrackLength),
    });

    return true;
  }

  return false;
}

/**
 * To calculate the translate value in x-axis of the data segment that it will will be rendered
 * @param {object} d the data
 * @param {array} sortedRow the sorted row which the data is inserted to the tailing
 * @param {number} totalTrackLength total track length
 *
 * @returns translate value in percentage (of track container)
 */
function calculateTranslateXInPercent(d, sortedRow, totalTrackLength) {
  return (
    (d.start -
      sortedRow
        .map((itm) => itm.end - itm.start)
        .reduce((prev, curr) => prev + curr)) /
    totalTrackLength
  );
}

/**
 * To calculate the width value of the data segment that it will will be rendered
 * @param {object} d
 * @param {number} totalTrackLength
 *
 * @return width of data segment in percentage (of track container)
 */
function calculateWidthOfDataSegment(d, totalTrackLength) {
  return ((d.end - d.start) / totalTrackLength) * 100;
}
